import { gql } from '@apollo/client';

const MY_CUSTOM_GLBS_QUERY = gql`
  query MyCustomGLBs {
    myCustomGLBs {
      id
      filename
      originalFilename
      fileSize
      storageUrl
      createdAt
    }
  }
`;

export default MY_CUSTOM_GLBS_QUERY;
