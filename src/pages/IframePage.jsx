import React from 'react';

const IframePage = () => {
  return (
    <div style={{ width: '100%', height: '100%', padding: '0px', overflow: 'hidden' }}>
      <iframe 
        src="/svgeditor/index.html" 
        title="矢量图制作页面" 
        style={{ width: '100%', height: '100%', overflow: 'hidden', border: 'none' }} 
        scrolling="no"
      ></iframe>
    </div>
  );
};

export default IframePage;