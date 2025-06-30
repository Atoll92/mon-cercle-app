import { styled } from '@mui/material/styles';

const StyledFlexBox = styled('div')({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    '& > *': {
        flex: '1 1 auto',
        boxSizing: 'border-box',
        height: 'auto',
    }
});

const FlexFlowBox = ({ children }) => {
    return (
        <StyledFlexBox>
            {children}
        </StyledFlexBox>
    );
}

export default FlexFlowBox;