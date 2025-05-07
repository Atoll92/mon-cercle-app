import { useRef, useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new//dist/quill.snow.css'; // Import Quill styles

const QuillEditor = ({value, setContent}) => {
  const quillRef = useRef(null);
  const [_value, _setValue] = useState(value);

    useEffect(() => {
        setContent(_value);
    }, [_value]);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'code-block'],
      ['clean']
    ]
  };

  // Quill formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image', 'code-block'
  ];

    return (
        <ReactQuill
            ref={quillRef}
            value={_value}
            onChange={_setValue}
            modules={modules}
            formats={formats}
            theme="snow"
        />
    );
};

export default QuillEditor;