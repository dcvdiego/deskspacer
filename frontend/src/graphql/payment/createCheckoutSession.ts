import { gql } from '@apollo/client';

const CREATE_CHECKOUT_SESSION_MUTATION = gql`
  mutation CreateCheckoutSession {
    createCheckoutSession {
      sessionID
      url
    }
  }
`;

export default CREATE_CHECKOUT_SESSION_MUTATION;
