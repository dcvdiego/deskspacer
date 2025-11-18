import { gql } from '@apollo/client';

const DELETE_CUSTOM_GLB_MUTATION = gql`
  mutation DeleteCustomGLB($id: UUID!) {
    deleteCustomGLB(id: $id)
  }
`;

export default DELETE_CUSTOM_GLB_MUTATION;
