package graph

import (
	"time"

	"github.com/google/uuid"
	"github.com/graphql-go/graphql"
	"github.com/graphql-go/graphql/language/ast"
)

// NewSchema creates and returns the GraphQL schema
func NewSchema(resolver *Resolver) (graphql.Schema, error) {
	// Custom UUID scalar type
	uuidType := graphql.NewScalar(graphql.ScalarConfig{
		Name:        "UUID",
		Description: "UUID scalar type",
		Serialize: func(value interface{}) interface{} {
			switch v := value.(type) {
			case uuid.UUID:
				return v.String()
			case *uuid.UUID:
				return v.String()
			default:
				return nil
			}
		},
		ParseValue: func(value interface{}) interface{} {
			switch v := value.(type) {
			case string:
				id, err := uuid.Parse(v)
				if err != nil {
					return nil
				}
				return id
			default:
				return nil
			}
		},
		ParseLiteral: func(valueAST ast.Value) interface{} {
			if strValue, ok := valueAST.(*ast.StringValue); ok {
				id, err := uuid.Parse(strValue.Value)
				if err != nil {
					return nil
				}
				return id
			}
			return nil
		},
	})

	// Custom Time scalar type
	timeType := graphql.NewScalar(graphql.ScalarConfig{
		Name:        "Time",
		Description: "Time scalar type",
		Serialize: func(value interface{}) interface{} {
			switch v := value.(type) {
			case time.Time:
				return v.Format(time.RFC3339)
			case *time.Time:
				return v.Format(time.RFC3339)
			default:
				return nil
			}
		},
		ParseValue: func(value interface{}) interface{} {
			switch v := value.(type) {
			case string:
				t, err := time.Parse(time.RFC3339, v)
				if err != nil {
					return nil
				}
				return t
			default:
				return nil
			}
		},
		ParseLiteral: func(valueAST ast.Value) interface{} {
			if strValue, ok := valueAST.(*ast.StringValue); ok {
				t, err := time.Parse(time.RFC3339, strValue.Value)
				if err != nil {
					return nil
				}
				return t
			}
			return nil
		},
	})

	// Build auth types
	userType, authPayloadType, _, _ := BuildAuthTypes(uuidType, timeType)

	// Build custom GLB type
	customGLBType := BuildCustomGLBType(uuidType, timeType)

	// SharedState type (kept for backward compatibility)
	sharedStateType := graphql.NewObject(graphql.ObjectConfig{
		Name:        "SharedState",
		Description: "SharedState represents a saved desk setup state",
		Fields: graphql.Fields{
			"id": &graphql.Field{
				Type:        graphql.NewNonNull(uuidType),
				Description: "Unique identifier for the shared state",
			},
			"stateData": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "JSON-serialized desk setup state data",
			},
			"expiresAt": &graphql.Field{
				Type:        graphql.NewNonNull(timeType),
				Description: "Expiration timestamp (UTC)",
			},
		},
	})

	// UserState type
	userStateType := graphql.NewObject(graphql.ObjectConfig{
		Name:        "UserState",
		Description: "UserState represents a user's saved canvas state",
		Fields: graphql.Fields{
			"id": &graphql.Field{
				Type:        graphql.NewNonNull(uuidType),
				Description: "Unique identifier for the state",
			},
			"name": &graphql.Field{
				Type:        graphql.String,
				Description: "User-friendly name for the state",
			},
			"stateData": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "JSON-serialized canvas state data",
			},
			"isPublic": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.Boolean),
				Description: "Whether this state is publicly accessible",
			},
			"publicToken": &graphql.Field{
				Type:        uuidType,
				Description: "Public sharing token (if public)",
			},
			"createdAt": &graphql.Field{
				Type:        graphql.NewNonNull(timeType),
				Description: "State creation timestamp",
			},
			"updatedAt": &graphql.Field{
				Type:        graphql.NewNonNull(timeType),
				Description: "Last update timestamp",
			},
		},
	})

	// Build auth queries and add to existing state queries
	authQueries := BuildAuthQueries(resolver, uuidType, userType)
	queryFields := graphql.Fields{
		// Existing state queries (backward compatibility)
		"states": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(sharedStateType))),
			Description: "Get all non-expired shared states",
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				return resolver.States(p.Context)
			},
		},
		"statesById": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(sharedStateType))),
			Description: "Get a specific shared state by ID",
			Args: graphql.FieldConfigArgument{
				"id": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(uuidType),
					Description: "ID of the shared state to retrieve",
				},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				id := p.Args["id"].(uuid.UUID)
				return resolver.StatesById(p.Context, id)
			},
		},
		// User state queries
		"myStates": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(userStateType))),
			Description: "Get all states owned by the authenticated user (requires authentication)",
			Resolve:     resolver.MyStates,
		},
		"publicState": &graphql.Field{
			Type:        userStateType,
			Description: "Get a public state by its public token",
			Args: graphql.FieldConfigArgument{
				"token": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(uuidType),
					Description: "Public token",
				},
			},
			Resolve: resolver.PublicState,
		},
	}

	// Merge auth queries into query fields
	for key, field := range authQueries {
		queryFields[key] = field
	}

	// Build and merge custom GLB queries
	customGLBQueries := BuildCustomGLBQueries(resolver, uuidType, customGLBType)
	for key, field := range customGLBQueries {
		queryFields[key] = field
	}

	// Query type
	queryType := graphql.NewObject(graphql.ObjectConfig{
		Name:   "Query",
		Fields: queryFields,
	})

	addStateInputType := graphql.NewInputObject(graphql.InputObjectConfig{
		Name:        "AddStateInput",
		Description: "Input type for adding a new shared state",
		Fields: graphql.InputObjectConfigFieldMap{
			"sharedState": &graphql.InputObjectFieldConfig{
				Type:        graphql.NewNonNull(graphql.String),
				Description: "JSON-serialized desk setup state",
			},
		},
	})

	addStatePayloadType := graphql.NewObject(graphql.ObjectConfig{
		Name:        "AddStatePayload",
		Description: "Payload returned when adding a state",
		Fields: graphql.Fields{
			"sharedState": &graphql.Field{
				Type:        graphql.NewNonNull(sharedStateType),
				Description: "The created shared state",
			},
		},
	})

	// Build auth mutations
	authMutations := BuildAuthMutations(resolver, authPayloadType)

	// Build mutation fields starting with existing mutations
	mutationFields := graphql.Fields{
		// Existing mutation (backward compatibility)
		"addState": &graphql.Field{
			Type:        graphql.NewNonNull(addStatePayloadType),
			Description: "Create a new shared state with automatic expiration",
			Args: graphql.FieldConfigArgument{
				"input": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(addStateInputType),
					Description: "Input containing the shared state data",
				},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				input := p.Args["input"].(map[string]interface{})
				sharedState := input["sharedState"].(string)
				state, err := resolver.AddState(p.Context, sharedState)
				if err != nil {
					return nil, err
				}
				// Wrap the result in the payload structure
				return map[string]interface{}{
					"sharedState": state,
				}, nil
			},
		},
		// User state mutations
		"saveState": &graphql.Field{
			Type:        graphql.NewNonNull(userStateType),
			Description: "Save a new canvas state for the authenticated user (requires authentication)",
			Args: graphql.FieldConfigArgument{
				"name": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(graphql.String),
					Description: "Name for the state",
				},
				"stateData": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(graphql.String),
					Description: "JSON-serialized canvas state data",
				},
				"isPublic": &graphql.ArgumentConfig{
					Type:        graphql.Boolean,
					Description: "Whether this state should be publicly accessible (default: false)",
				},
			},
			Resolve: resolver.SaveState,
		},
		"updateState": &graphql.Field{
			Type:        graphql.NewNonNull(userStateType),
			Description: "Update an existing user state (requires authentication, must own the state)",
			Args: graphql.FieldConfigArgument{
				"id": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(uuidType),
					Description: "State ID",
				},
				"name": &graphql.ArgumentConfig{
					Type:        graphql.String,
					Description: "New name for the state",
				},
				"stateData": &graphql.ArgumentConfig{
					Type:        graphql.String,
					Description: "New state data",
				},
				"isPublic": &graphql.ArgumentConfig{
					Type:        graphql.Boolean,
					Description: "New public status",
				},
			},
			Resolve: resolver.UpdateState,
		},
		"deleteState": &graphql.Field{
			Type:        graphql.NewNonNull(graphql.Boolean),
			Description: "Delete a user state (requires authentication, must own the state)",
			Args: graphql.FieldConfigArgument{
				"id": &graphql.ArgumentConfig{
					Type:        graphql.NewNonNull(uuidType),
					Description: "State ID to delete",
				},
			},
			Resolve: resolver.DeleteState,
		},
	}

	// Merge auth mutations into mutation fields
	for key, field := range authMutations {
		mutationFields[key] = field
	}

	// Build and merge custom GLB mutations
	customGLBMutations := BuildCustomGLBMutations(resolver, uuidType, customGLBType)
	for key, field := range customGLBMutations {
		mutationFields[key] = field
	}

	// Mutation type
	mutationType := graphql.NewObject(graphql.ObjectConfig{
		Name:   "Mutation",
		Fields: mutationFields,
	})

	// Create and return the schema
	return graphql.NewSchema(graphql.SchemaConfig{
		Query:    queryType,
		Mutation: mutationType,
	})
}
