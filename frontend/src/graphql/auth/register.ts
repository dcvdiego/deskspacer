import { gql } from '@apollo/client';

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        username
        isPremium
        emailVerified
        createdAt
      }
    }
  }
`;

export default REGISTER_MUTATION;
