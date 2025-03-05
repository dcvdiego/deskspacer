import { gql } from '@apollo/client';

const ADD_STATE_QUERY = gql`
  mutation Mutation($input: AddStateInput!) {
    addState(input: $input) {
      sharedState {
        id
      }
    }
  }
`;

export default ADD_STATE_QUERY;
