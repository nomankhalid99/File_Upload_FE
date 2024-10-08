import React, { useState } from "react";
import GooglePicker from "react-google-picker";
import axios from "axios";

const Home = () => {
  const CLIENT_ID =
    "19549456256-d95e70m8bluhveomm0k9hm8386u9h6e8.apps.googleusercontent.com"; // Replace with your actual Google Client ID
  const DEVELOPER_KEY = "AIzaSyDWtr3qBE-8i3NJWxWO6tcdbAbM847nS-E"; // Replace with your actual Google API Key
  const SCOPE = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.readonly",
  ];

  const [files, setFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (file) => {
    const selectedFile = {
      name: file.name,
      size: file.sizeBytes,
      type: file.mimeType,
      id: file.id,
      isGoogleDrive: true,
    };
    validateAndSetFiles([selectedFile]);
  };

  const validateAndSetFiles = (selectedFiles) => {
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage("File size must be less than 25 MB.");
        return false;
      } else if (
        !["application/pdf", "image/jpeg", "image/png"].includes(file.type)
      ) {
        setErrorMessage("Only PDF, JPEG, and PNG files are allowed.");
        return false;
      }
      return true;
    });

    setErrorMessage("");
    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    const formData = new FormData();
    for (const file of files) {
      if (file.isGoogleDrive) {
        try {
          const response = await axios.get(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            {
              headers: {
                Authorization: `Bearer ${file.oauthToken}`,
              },
              responseType: "blob",
            }
          );
          formData.append("file", response.data, file.name);
        } catch (error) {
          console.error("Error fetching Google Drive file:", error);
          return;
        }
      } else {
        formData.append("file", file);
      }
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      if (response.status === 200) {
        alert("Files uploaded successfully!");
        setFiles([]);
        setUploadProgress(0);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        alert(error.response.data.error);
      } else {
        alert("Error uploading files.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen flex-col w-screen bg-neutral-300">
      <div className="bg-white rounded-lg p-5 shadow-md">
        <h1 className="text-4xl text-center font-bold text-neutral-800">
          Upload Files
        </h1>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 w-full justify-center mt-6"
        >
          <input
            type="file"
            onChange={(e) => validateAndSetFiles(Array.from(e.target.files))}
            multiple
            className="flex h-10 rounded-md border border-input bg-neutral-200 px-3 py-2 text-sm text-gray-400 file:border-0 file:bg-transparent file:text-gray-600 file:text-sm file:font-semibold"
          />
          <GooglePicker
            clientId={CLIENT_ID}
            developerKey={DEVELOPER_KEY}
            scope={SCOPE}
            onChange={(data) => console.log("on change:", data)}
            onAuthFailed={(data) => console.log("on auth failed:", data)}
            multiselect={true}
            navHidden={true}
            authImmediate={false}
            mimeTypes={["application/pdf", "image/png", "image/jpeg"]}
            viewId={"DOCS"}
            createPicker={(google, oauthToken) => {
              const picker = new google.picker.PickerBuilder()
                .addView(google.picker.ViewId.DOCS)
                .setOAuthToken(oauthToken)
                .setDeveloperKey(DEVELOPER_KEY)
                .setCallback((data) => {
                  if (data.action === google.picker.Action.PICKED) {
                    const file = data.docs[0];
                    handleFileSelect(file);
                  }
                });
              picker.build().setVisible(true);
            }}
          >
            <button className="bg-gradient-to-r from-blue-400 w-full text-white px-5 py-2 rounded-lg to-blue-800 font-semibold  hover:from-blue-500 hover:to-blue-900 ">
              Choose from Google Drive
            </button>
          </GooglePicker>

          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
          {uploadProgress > 0 && <p>Uploading: {uploadProgress}%</p>}
          <div className="flex gap-3 items-center">
            <button
              type="submit"
              className="bg-gradient-to-tl from-blue-400 hover:from-blue-500 hover:to-blue-900  text-white px-5 py-2 rounded-lg to-blue-800 font-semibold"
            >
              Upload
            </button>
            <a
              href="/invoice"
              className=" group bg-gradient-to-l flex items-center justify-center w-full gap-2 from-blue-400 text-center text-white px-5 py-2 rounded-lg to-blue-800 font-semibold  hover:from-blue-500 hover:to-blue-900 "
            >
              View Invoices
              <svg
                fill="none"
                stroke="currentColor"
                width="11"
                height="11"
                viewBox="0 0 10 10"
                aria-hidden="true"
                strokeWidth="1.5"
                className="text-white"
                strokeLinecap="round"
              >
                <path
                  className="opacity-0 transition group-hover:opacity-100"
                  d="M0 5h7"
                  strokeLinecap="round"
                ></path>
                <path
                  className="transition group-hover:translate-x-[3px]"
                  d="M1 1l4 4-4 4"
                  strokeLinecap="round"
                ></path>
              </svg>
            </a>
          </div>
        </form>
        <ul className="mt-5">
          {files.map((file, index) => (
            <li key={index} className="font-semibold">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;

// import React, { useState } from 'react';
// import GooglePicker from 'react-google-picker';
// import axios from 'axios';

// const App = () => {
//   const CLIENT_ID = '19549456256-d95e70m8bluhveomm0k9hm8386u9h6e8.apps.googleusercontent.com';  // Replace with your actual Google Client ID
//   const DEVELOPER_KEY = 'AIzaSyDWtr3qBE-8i3NJWxWO6tcdbAbM847nS-E';  // Replace with your actual Google API Key
//   const SCOPE = ['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.readonly'];

//   const [selectedFile, setSelectedFile] = useState(null);

//   const handleFileSelect = (file) => {
//     setSelectedFile(file);
//     uploadFile(file);
//   };

//   const uploadFile = async (file) => {
//     try {
//       const response = await axios.post('http://localhost:5000/upload', {
//         fileId: file.id,
//         fileName: file.name,
//         fileType: file.mimeType,
//       });
//       console.log('File uploaded successfully:', response.data);
//     } catch (error) {
//       console.error('Error uploading file:', error);
//     }
//   };

//   return (
//     <div>
//       <h1>Upload Files from Google Drive</h1>
//   <GooglePicker
//     clientId={CLIENT_ID}
//     developerKey={DEVELOPER_KEY}
//     scope={SCOPE}
//     onChange={data => console.log('on change:', data)}
//     onAuthFailed={data => console.log('on auth failed:', data)}
//     multiselect={true}
//     navHidden={true}
//     authImmediate={false}
//     mimeTypes={['application/pdf', 'image/png', 'image/jpeg']}
//     viewId={'DOCS'}
//     createPicker={(google, oauthToken) => {
//       const picker = new google.picker.PickerBuilder()
//         .addView(google.picker.ViewId.DOCS)
//         .setOAuthToken(oauthToken)
//         .setDeveloperKey(DEVELOPER_KEY)
//         .setCallback((data) => {
//           if (data.action === google.picker.Action.PICKED) {
//             const file = data.docs[0];
//             handleFileSelect(file);
//           }
//         });
//       picker.build().setVisible(true);
//     }}>
//     <button>Pick Files</button>
//   </GooglePicker>

//       {selectedFile && (
//         <div>
//           <h2>Selected File:</h2>
//           <p>{selectedFile.name}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;
