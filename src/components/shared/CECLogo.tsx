import React from "react";
import logoImage from "@/assets/Recurso-1CEC-bco.png";

interface CECLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export const CECLogo: React.FC<CECLogoProps> = ({ className = "", ...props }) => {
  return (
    <img 
      src={logoImage} 
      alt="CEC Logo" 
      className={className}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      {...props}
    />
  );
};

export default CECLogo;

