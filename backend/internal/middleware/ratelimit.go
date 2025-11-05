package middleware

import (
	"net/http"
	"sync"

	"golang.org/x/time/rate"
)

// RateLimiter is a middleware that limits requests per IP address
type RateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
}

// NewRateLimiter creates a new rate limiter middleware
// ratePerMinute: number of requests allowed per minute
// burst: maximum burst size (allows temporary spikes)
func NewRateLimiter(ratePerMinute, burst int) *RateLimiter {
	// Convert requests per minute to requests per second
	r := rate.Limit(float64(ratePerMinute) / 60.0)

	return &RateLimiter{
		limiters: make(map[string]*rate.Limiter),
		rate:     r,
		burst:    burst,
	}
}

// getLimiter returns the rate limiter for a specific IP address
func (rl *RateLimiter) getLimiter(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter, exists := rl.limiters[ip]
	if !exists {
		limiter = rate.NewLimiter(rl.rate, rl.burst)
		rl.limiters[ip] = limiter
	}

	return limiter
}

// Middleware returns an HTTP middleware that rate limits requests
func (rl *RateLimiter) Middleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get client IP (consider X-Forwarded-For for proxied requests)
			ip := r.RemoteAddr
			if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
				ip = xff
			}

			limiter := rl.getLimiter(ip)

			if !limiter.Allow() {
				http.Error(w, "Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// Cleanup removes old limiters (call periodically to prevent memory leaks)
func (rl *RateLimiter) Cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Clear all limiters (simple approach; could be more sophisticated)
	rl.limiters = make(map[string]*rate.Limiter)
}
