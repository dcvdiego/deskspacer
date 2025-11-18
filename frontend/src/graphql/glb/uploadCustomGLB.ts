import { gql } from '@apollo/client';

const UPLOAD_CUSTOM_GLB_MUTATION = gql`
  mutation UploadCustomGLB($input: UploadCustomGLBInput!) {
    uploadCustomGLB(input: $input) {
      id
      filename
      originalFilename
      fileSize
      storageUrl
      createdAt
    }
  }
`;

export default UPLOAD_CUSTOM_GLB_MUTATION;
