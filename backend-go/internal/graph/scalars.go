package graph

import (
	"fmt"
	"io"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/google/uuid"
)

// MarshalUUID marshals UUID to GraphQL
func MarshalUUID(u uuid.UUID) graphql.Marshaler {
	return graphql.WriterFunc(func(w io.Writer) {
		io.WriteString(w, fmt.Sprintf(`"%s"`, u.String()))
	})
}

// UnmarshalUUID unmarshals GraphQL input to UUID
func UnmarshalUUID(v interface{}) (uuid.UUID, error) {
	switch v := v.(type) {
	case string:
		return uuid.Parse(v)
	case []byte:
		return uuid.ParseBytes(v)
	default:
		return uuid.UUID{}, fmt.Errorf("invalid UUID type: %T", v)
	}
}

// MarshalTime marshals time.Time to GraphQL (RFC3339 format)
func MarshalTime(t time.Time) graphql.Marshaler {
	return graphql.WriterFunc(func(w io.Writer) {
		io.WriteString(w, fmt.Sprintf(`"%s"`, t.Format(time.RFC3339)))
	})
}

// UnmarshalTime unmarshals GraphQL input to time.Time
func UnmarshalTime(v interface{}) (time.Time, error) {
	switch v := v.(type) {
	case string:
		return time.Parse(time.RFC3339, v)
	case int64:
		return time.Unix(v, 0), nil
	default:
		return time.Time{}, fmt.Errorf("invalid time type: %T", v)
	}
}
