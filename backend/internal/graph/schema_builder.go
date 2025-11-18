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

// BuildCustomGLBType builds the CustomGLB GraphQL type
func BuildCustomGLBType(uuidType, timeType *graphql.Scalar) *graphql.Object {
	return graphql.NewObject(graphql.ObjectConfig{
		Name:        "CustomGLB",
		Description: "CustomGLB represents a user-uploaded custom 3D model file",
		Fields: graphql.Fields{
			"id": &graphql.Field{
				Type:        graphql.NewNonNull(uuidType),
				Description: "Unique identifier for the custom GLB",
			},
			"userID": &graphql.Field{
				Type:        graphql.NewNonNull(uuidType),
				Description: "ID of the user who uploaded this GLB",
			},
			"filename": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "Filename in storage (unique, generated)",
			},
			"originalFilename": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "Original filename as uploaded by user",
			},
			"fileSize": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.Int),
				Description: "File size in bytes",
			},
			"storageURL": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "Public URL to access the file",
			},
			"createdAt": &graphql.Field{
				Type:        graphql.NewNonNull(timeType),
				Description: "Upload timestamp",
			},
		},
	})
}

// BuildCustomGLBQueries builds custom GLB query fields
func BuildCustomGLBQueries(resolver *Resolver, uuidType *graphql.Scalar, customGLBType *graphql.Object) graphql.Fields {
	return graphql.Fields{
		"myCustomGLBs": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(customGLBType))),
			Description: "Get all custom GLBs uploaded by the authenticated user (requires premium)",
			Resolve:     resolver.MyCustomGLBs,
		},
		"customGLB": &graphql.Field{
			Type:        customGLBType,
			Description: "Get a specific custom GLB by ID",
			Args: graphql.FieldConfigArgument{
				"id": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(uuidType),
					Description: "GLB ID",
				},
			},
			Resolve: resolver.CustomGLB,
		},
	}
}

// BuildCustomGLBMutations builds custom GLB mutation fields
func BuildCustomGLBMutations(resolver *Resolver, uuidType *graphql.Scalar, customGLBType *graphql.Object) graphql.Fields {
	return graphql.Fields{
		"uploadCustomGLB": &graphql.Field{
			Type:        graphql.NewNonNull(customGLBType),
			Description: "Upload a custom GLB file (requires premium)",
			Args: graphql.FieldConfigArgument{
				"filename": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(graphql.String),
					Description: "Original filename",
				},
				"fileData": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(graphql.String),
					Description: "Base64-encoded file data",
				},
			},
			Resolve: resolver.UploadCustomGLB,
		},
		"deleteCustomGLB": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.Boolean),
			Description: "Delete a custom GLB file",
			Args: graphql.FieldConfigArgument{
				"id": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(uuidType),
					Description: "GLB ID to delete",
				},
			},
			Resolve: resolver.DeleteCustomGLB,
		},
	}
}
// BuildCheckoutSessionType builds the CheckoutSession GraphQL type
func BuildCheckoutSessionType() *graphql.Object {
	return graphql.NewObject(graphql.ObjectConfig{
		Name:        "CheckoutSession",
		Description: "Stripe checkout session for premium subscription",
		Fields: graphql.Fields{
			"sessionID": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "Stripe checkout session ID",
			},
			"url": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "Stripe checkout URL to redirect user to",
			},
		},
	})
}

// BuildPaymentMutations builds payment-related mutations
func BuildPaymentMutations(resolver *Resolver, checkoutSessionType *graphql.Object) graphql.Fields {
	return graphql.Fields{
		"createCheckoutSession": &graphql.Field{
			Type:        graphql.NewNonNull(checkoutSessionType),
			Description: "Create a Stripe checkout session for premium subscription",
			Resolve:     resolver.CreateCheckoutSession,
		},
	}
}
