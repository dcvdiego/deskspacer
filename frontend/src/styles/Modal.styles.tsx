import { Box, styled } from '@mui/material';
export const StyledModal = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 600px;
  background-color: ${(props) => props.theme.palette.background.paper};
  border: 2px solid #000;
  box-shadow: 24px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;
