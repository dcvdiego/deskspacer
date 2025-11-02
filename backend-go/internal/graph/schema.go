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

	// SharedState type
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

	// Query type
	queryType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
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
		},
	})

	// Mutation type
	mutationType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Mutation",
		Fields: graphql.Fields{
			"addState": &graphql.Field{
				Type:        graphql.NewNonNull(sharedStateType),
				Description: "Create a new shared state with automatic expiration",
				Args: graphql.FieldConfigArgument{
					"sharedState": &graphql.ArgumentConfig{
						Type:        graphql.NewNonNull(graphql.String),
						Description: "JSON-serialized desk setup state",
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					sharedState := p.Args["sharedState"].(string)
					return resolver.AddState(p.Context, sharedState)
				},
			},
		},
	})

	// Create and return the schema
	return graphql.NewSchema(graphql.SchemaConfig{
		Query:    queryType,
		Mutation: mutationType,
	})
}
