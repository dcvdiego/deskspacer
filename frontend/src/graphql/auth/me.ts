import { gql } from '@apollo/client';

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      username
      isPremium
      emailVerified
      createdAt
      stateCount
      glbCount
    }
  }
`;

export default ME_QUERY;
