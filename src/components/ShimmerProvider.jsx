import { useEffect, useState, useRef } from "react";

// const ShimmerProvider = () => {
// 	const [mouseX, setMouseX] = useState(0);
// 	const [mouseY, setMouseY] = useState(0);
// 	const animationRef = useRef();
  
// 	useEffect(() => {
// 	  // Initialize the CSS variable if not already set
// 	  if (!document.documentElement.style.getPropertyValue("--shimmer-mouse-offset")) {
// 		document.documentElement.style.setProperty("--shimmer-mouse-offset", "0");
// 	  }
  
// 	  const handleMouseMove = (event) => {
// 		setMouseX(event.clientX);
// 		setMouseY(event.clientY);
// 	  };
  
// 	  const computeAndSetOffset = () => {
// 		const xComponent = Math.sin(mouseX / 500);
// 		const yComponent = Math.sin(mouseY / 500);
// 		const timeComponent = Math.sin(Date.now() / 1000);
// 		const finalOffset = Math.sin(xComponent + yComponent + timeComponent) * 500;
		
// 		document.documentElement.style.setProperty(
// 		  "--shimmer-mouse-offset",
// 		  `${finalOffset}`
// 		);
// 	  };
  
// 	  document.addEventListener("mousemove", handleMouseMove);
	  
// 	  // Update the CSS variable on every frame
// 	  const updateOffset = () => {
// 		computeAndSetOffset();
// 		animationRef.current = requestAnimationFrame(updateOffset);
// 	  };
	  
// 	  // Start the animation
// 	  animationRef.current = requestAnimationFrame(updateOffset);
	  
// 	  // Cleanup function to remove the event listener and cancel animation
// 	  return () => {
// 		document.removeEventListener("mousemove", handleMouseMove);
// 		if (animationRef.current) {
// 		  cancelAnimationFrame(animationRef.current);
// 		}
// 	  };
// 	}, [mouseX, mouseY]); // Add mouseX and mouseY as dependencies
  
// 	// This component doesn't render anything visible
// 	return null;
// };

// const ShimmerProvider = () => {
  
// 	useEffect(() => {
// 	  // Initialize the CSS variable if not already set
// 	  if (!document.documentElement.style.getPropertyValue("--shimmer-mouse-offset")) {
// 		document.documentElement.style.setProperty("--shimmer-mouse-offset", "0");
// 	  }
  
// 	  const handlescroll = () => {
// 		const scrollTop = window.scrollY || document.documentElement.scrollTop;
// 		const finalOffset = Math.sin(Math.sin(scrollTop / 500)) * 500;
		
// 		document.documentElement.style.setProperty(
// 		  "--shimmer-mouse-offset",
// 		  `${finalOffset}`
// 		);
// 	  };
  
// 	  document.addEventListener("scroll", handlescroll);
	  
// 	  // Cleanup function to remove the event listener
// 	  return () => {
// 		document.removeEventListener("scroll", handlescroll);
// 	  };
// 	}, []);
  
// 	// This component doesn't render anything visible
// 	return null;
// };


// now a combination of the two : the css var will be set as scroll + time and the mouse won't be used
const ShimmerProvider = () => {
	const animationRef = useRef();
  
	useEffect(() => {
	  // Initialize the CSS variable if not already set
	  if (!document.documentElement.style.getPropertyValue("--shimmer-mouse-offset")) {
		document.documentElement.style.setProperty("--shimmer-mouse-offset", "0");
	  }
  
	  const computeAndSetOffset = () => {
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const timeComponent = Math.sin(Date.now() / 5000);
		const finalOffset = Math.sin(scrollTop / 1000 + timeComponent) * 500;
		
		document.documentElement.style.setProperty(
		  "--shimmer-mouse-offset",
		  `${finalOffset}`
		);
	  };
  
	  // Update the CSS variable on every frame
	  const updateOffset = () => {
		computeAndSetOffset();
		animationRef.current = requestAnimationFrame(updateOffset);
	  };
	  
	  // Start the animation
	  animationRef.current = requestAnimationFrame(updateOffset);
	  
	  // Cleanup function to cancel animation
	  return () => {
		if (animationRef.current) {
		  cancelAnimationFrame(animationRef.current);
		}
	  };
	}, []); // No dependencies, runs only once
  
	return null; // This component doesn't render anything visible
}

export default ShimmerProvider;
