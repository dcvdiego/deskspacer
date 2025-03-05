import { gql } from '@apollo/client';

const STATES_BY_ID_QUERY = gql`
  query Query($id: UUID!) {
    statesById(id: $id) {
      stateData
    }
  }
`;
export default STATES_BY_ID_QUERY;
