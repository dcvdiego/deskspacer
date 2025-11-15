package graph

import (
	"github.com/graphql-go/graphql"
)

// BuildAuthTypes builds all authentication-related GraphQL types
func BuildAuthTypes(uuidType, timeType *graphql.Scalar) (userType, authPayloadType, registerInputType, loginInputType *graphql.Object) {
	// User type
	userType = graphql.NewObject(graphql.ObjectConfig{
		Name:        "User",
		Description: "User represents a registered user account",
		Fields: graphql.Fields{
			"id": &graphql.Field{
				Type:        graphql.NewNonNull(uuidType),
				Description: "Unique user identifier",
			},
			"email": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "User's email address",
			},
			"username": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "User's username",
			},
			"emailVerified": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.Boolean),
				Description: "Whether the user's email has been verified",
			},
			"isPremium": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.Boolean),
				Description: "Whether the user has premium membership",
			},
			"stateCount": &graphql.Field{
				Type:        graphql.Int,
				Description: "Number of saved states",
			},
			"glbCount": &graphql.Field{
				Type:        graphql.Int,
				Description: "Number of custom GLBs uploaded",
			},
			"storageUsed": &graphql.Field{
				Type:        graphql.Int,
				Description: "Storage used in bytes",
			},
			"createdAt": &graphql.Field{
				Type:        graphql.NewNonNull(timeType),
				Description: "Account creation timestamp",
			},
		},
	})

	// AuthPayload type
	authPayloadType = graphql.NewObject(graphql.ObjectConfig{
		Name:        "AuthPayload",
		Description: "AuthPayload returned after successful authentication",
		Fields: graphql.Fields{
			"user": &graphql.Field{
				Type:        graphql.NewNonNull(userType),
				Description: "The authenticated user",
			},
			"accessToken": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "Short-lived access token (15 minutes)",
			},
			"refreshToken": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "Long-lived refresh token (7 days)",
			},
		},
	})

	// RegisterInput type
	registerInputType = graphql.NewObject(graphql.ObjectConfig{
		Name:        "RegisterInput",
		Description: "Input for user registration",
		Fields: graphql.Fields{
			"email": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "User's email address",
			},
			"username": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "Desired username (3-20 characters)",
			},
			"password": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "Password (min 8 chars, uppercase, lowercase, number, special)",
			},
		},
	})

	// LoginInput type
	loginInputType = graphql.NewObject(graphql.ObjectConfig{
		Name:        "LoginInput",
		Description: "Input for user login",
		Fields: graphql.Fields{
			"email": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "User's email address",
			},
			"password": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "User's password",
			},
		},
	})

	return
}

// BuildAuthQueries builds all authentication-related queries
func BuildAuthQueries(resolver *Resolver, uuidType *graphql.Scalar, userType *graphql.Object) graphql.Fields {
	return graphql.Fields{
		"me": &graphql.Field{
			Type:        userType,
			Description: "Get the currently authenticated user (requires authentication)",
			Resolve:     resolver.Me,
		},
		"checkEmailAvailable": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.Boolean),
			Description: "Check if an email is available for registration",
			Args: graphql.FieldConfigArgument{
				"email": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(graphql.String),
					Description: "Email to check",
				},
			},
			Resolve: resolver.CheckEmailAvailable,
		},
		"checkUsernameAvailable": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.Boolean),
			Description: "Check if a username is available for registration",
			Args: graphql.FieldConfigArgument{
				"username": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(graphql.String),
					Description: "Username to check",
				},
			},
			Resolve: resolver.CheckUsernameAvailable,
		},
	}
}

// BuildAuthMutations builds all authentication-related mutations
func BuildAuthMutations(resolver *Resolver, authPayloadType *graphql.Object) graphql.Fields {
	// RegisterInput input type
	registerInputType := graphql.NewInputObject(graphql.InputObjectConfig{
		Name: "RegisterInput",
		Fields: graphql.InputObjectConfigFieldMap{
			"email": &graphql.InputObjectFieldConfig{
				Type: graphql.NewNonNull(graphql.String),
			},
			"username": &graphql.InputObjectFieldConfig{
				Type: graphql.NewNonNull(graphql.String),
			},
			"password": &graphql.InputObjectFieldConfig{
				Type: graphql.NewNonNull(graphql.String),
			},
		},
	})

	// LoginInput input type
	loginInputType := graphql.NewInputObject(graphql.InputObjectConfig{
		Name: "LoginInput",
		Fields: graphql.InputObjectConfigFieldMap{
			"email": &graphql.InputObjectFieldConfig{
				Type: graphql.NewNonNull(graphql.String),
			},
			"password": &graphql.InputObjectFieldConfig{
				Type: graphql.NewNonNull(graphql.String),
			},
		},
	})

	return graphql.Fields{
		"register": &graphql.Field{
			Type:        graphql.NewNonNull(authPayloadType),
			Description: "Register a new user account",
			Args: graphql.FieldConfigArgument{
				"input": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(registerInputType),
					Description: "Registration input",
				},
			},
			Resolve: resolver.Register,
		},
		"login": &graphql.Field{
			Type:        graphql.NewNonNull(authPayloadType),
			Description: "Authenticate a user with email and password",
			Args: graphql.FieldConfigArgument{
				"input": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(loginInputType),
					Description: "Login credentials",
				},
			},
			Resolve: resolver.Login,
		},
		"refreshToken": &graphql.Field{
			Type:        graphql.NewNonNull(authPayloadType),
			Description: "Refresh an expired access token using a refresh token",
			Args: graphql.FieldConfigArgument{
				"refreshToken": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(graphql.String),
					Description: "Refresh token",
				},
			},
			Resolve: resolver.RefreshToken,
		},
		"verifyEmail": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.Boolean),
			Description: "Verify email address using verification token",
			Args: graphql.FieldConfigArgument{
				"token": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(graphql.String),
					Description: "Email verification token",
				},
			},
			Resolve: resolver.VerifyEmail,
		},
		"requestPasswordReset": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.Boolean),
			Description: "Request a password reset email",
			Args: graphql.FieldConfigArgument{
				"email": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(graphql.String),
					Description: "Email address",
				},
			},
			Resolve: resolver.RequestPasswordReset,
		},
		"resetPassword": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.Boolean),
			Description: "Reset password using a reset token",
			Args: graphql.FieldConfigArgument{
				"token": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(graphql.String),
					Description: "Password reset token",
				},
				"newPassword": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(graphql.String),
					Description: "New password",
				},
			},
			Resolve: resolver.ResetPassword,
		},
	}
}
