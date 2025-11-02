import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

interface SpacerProps {
  time: number;
  spacing: number;
}
const increaseLetterSpacing = (x: number) => keyframes`
 0% {
    letter-spacing: 0px;
  }
  100% {
    letter-spacing: ${x}px; 
  }

`;
export const Spacer = styled.b<SpacerProps>`
  animation: ${(props) => increaseLetterSpacing(props.spacing)}
    ${(props) => props.time}s ease forwards;
`;
