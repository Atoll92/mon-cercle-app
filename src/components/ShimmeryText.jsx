import React from 'react';

const ShimmeryText = ({ children }) => {

    const randomGradientAngle = React.useMemo(() => Math.floor(Math.random() * 360), []);
    const randomGradientOffset = React.useMemo(() => Math.floor(Math.random() * 100), []);
    const randomGlowOffset = React.useMemo(() => Math.floor(Math.random() * 100), []);

    return (
        <span
            style={{
                // background: `linear-gradient(calc(${randomGradientAngle}deg + var(--shimmer-mouse-offset, 0) * 0.5deg), #000000, #888888, ${randomGradientOffset}%, #000000)`,
                background: `linear-gradient(calc(${randomGradientAngle}deg + var(--shimmer-mouse-offset, 0) * 0.5deg), #888888, #ffffff, ${randomGradientOffset}%, #888888)`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '200% 100%',
                color: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                textShadow: `0 0 15px rgba(calc((var(--shimmer-mouse-offset, 0) - ${randomGlowOffset}) * 0.3), calc((var(--shimmer-mouse-offset, 0) - ${randomGlowOffset}) * 0.3), calc((var(--shimmer-mouse-offset, 0) - ${randomGlowOffset}) * 0.3), 0.5)`,
            }}
        >
            {children}
        </span>
    );
};

export default ShimmeryText;