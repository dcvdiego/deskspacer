import styled from 'styled-components';

export const Button = styled.button`
  padding: 1.3em 3em;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  font-weight: 500;
  color: #000;
  background-color: #fff;
  border: none;
  border-radius: 45px;
  box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease 0s;
  cursor: pointer;
  outline: none;
  &:hover {
    background-color: #a22ee5;
    box-shadow: 0px 15px 20px rgba(110, 46, 229, 0.4);
    color: #fff;
    transform: translateY(-7px);
  }
  &:active {
    transform: translateY(-1px);
  }
`;
export const Container = styled.div<{ lightMode?: boolean }>`
  background-color: ${(props) => (props.lightMode ? '#f9f4fe' : 'black')};
  min-height: ${(props) => (props.lightMode ? '0' : '100vh')};
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  color: white;
  padding-top: 4rem;
  padding-bottom: 4rem;
`;
