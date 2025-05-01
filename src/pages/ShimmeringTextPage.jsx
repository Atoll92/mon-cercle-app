import React from "react";
import ShimmeryText from '../components/ShimmeryText';
import ShimmerProvider from '../components/ShimmerProvider';

const ShimmeringTextPage = () => {
    return (
        <div style={{ 
            backgroundColor: 'black',
            color: '#444444',
            fontWeight: 'bold',
            minHeight: '100vh',
            textAlign: 'center',
            padding: '20px',
        }}>
            <ShimmerProvider />
            <h1 style={{ fontSize: '6rem', margin: '80px 0' }}>
                <ShimmeryText>Shimmering Text Example</ShimmeryText>
            </h1>
            <p style={{ fontSize: '2rem', margin: '20px 0' }}>
                This is an example of <ShimmeryText>shimmering</ShimmeryText> text using <ShimmeryText>CSS gradients</ShimmeryText> and <ShimmeryText>scroll position</ShimmeryText>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', padding: '20px', fontSize: '3rem' }}>
                <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px' }}>
                    <ShimmeryText>Item 1</ShimmeryText>
                    <p style={{ fontSize: '1rem'}}>This is a description for item 1. Here is some more content to fill the space.</p>
                </div>
                <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px' }}>
                    <ShimmeryText>Item 2</ShimmeryText>
                    <p style={{ fontSize: '1rem'}}>This is a description for item 2 with some more text.</p>
                </div>
                <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px' }}>
                    <ShimmeryText>Item 3</ShimmeryText>
                    <p style={{ fontSize: '1rem'}}>This is a description for item 3 and here is some more text to make it longer.</p>
                </div>
                <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px' }}>
                    <ShimmeryText>Item 4</ShimmeryText>
                    <p style={{ fontSize: '1rem'}}>This is a description for item 4 with some more text to test the layout.</p>
                </div>
                <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px' }}>
                    <ShimmeryText>Item 5</ShimmeryText>
                    <p style={{ fontSize: '1rem'}}>This is a description for item 5 with even more text and words.</p>
                </div>
                <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px' }}>
                    <ShimmeryText>Item 6</ShimmeryText>
                    <p style={{ fontSize: '1rem'}}>This is a description for item 6 with some additionnal text to test the layout.</p>
                </div>
            </div>
            <p style={{ fontSize: '2rem', margin: '60px 0' }}>
                And now let's <ShimmeryText>look at an example</ShimmeryText> of more <ShimmeryText>shimmering</ShimmeryText> text being tested in <ShimmeryText>a different manner</ShimmeryText>.
            </p> 
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px', padding: '20px', fontSize: '2.5rem' }}>
                <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px' }}>
                    <ShimmeryText>Item number 7</ShimmeryText>
                    <br/><br/>
                    <p style={{ fontSize: '1rem'}}>This is a description for item 7. This time with a bit of a longer text, in order to have a longer paragraph that will span multiple lines.</p>
                </div>
                <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px' }}>
                    <ShimmeryText>Item numero 8</ShimmeryText>
                    <br/><br/>
                    <p style={{ fontSize: '1rem'}}>This is a description for item 8 with some more text, all text in this section should be longer than in the previous section.</p>
                </div>
                <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px' }}>
                    <ShimmeryText>Item the 9th</ShimmeryText>
                    <br/><br/>
                    <p style={{ fontSize: '1rem'}}>This is a description for item 9 and here is some more text to make it longer. This is a description for item 9 and here is some more text to make it longer.</p>
                </div>
                <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px' }}>
                    <ShimmeryText>Item 10°</ShimmeryText>
                    <br/><br/>
                    <p style={{ fontSize: '1rem'}}>This is a description for item 10 with some more text to test the layout. Every description should be longer than the previous one.</p>
                </div>
            </div>
            <p style={{ fontSize: '2rem', margin: '60px 0' }}>
                Pretty <ShimmeryText>nice</ShimmeryText>, right?
            </p> 
        </div>
    );
}

export default ShimmeringTextPage;