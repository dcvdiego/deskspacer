import { gql } from '@apollo/client';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
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

export default LOGIN_MUTATION;
