import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';
import Sidebar from '../components/Sidebar';
import { signOut } from '../redux/user/userSlice';  // Correct import for signOut
import { useNavigate } from 'react-router-dom';

export default function HotelProfile() {
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const [image, setImage] = useState(undefined);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const { currentUser, loading, error } = useSelector((state) => state.user);

  useEffect(() => {
    if (image) {
      handleFileUpload(image);
    }
  }, [image]);

  const handleFileUpload = async (image) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + image.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, image);
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImagePercent(Math.round(progress));
      },
      (error) => {
        setImageError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
          setFormData({ ...formData, profilePicture: downloadURL })
        );
      }
    );
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (formData.hotelName && formData.hotelName.length < 3) {
      newErrors.hotelName = 'Hotel name must be at least 3 characters long';
    }
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await fetch(`/api/hotel/update/${currentUser.hotelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        alert('Error updating hotel');
        return;
      }

      setUpdateSuccess(true);
    } catch (error) {
      console.error('Error updating hotel:', error);
    }
  };
  

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout');
      dispatch(signOut()); // Assuming signOut is a Redux action
      navigate('/login'); // Redirect to the login page
    } catch (error) {
      console.error(error);
    }
  };
  

  return (
    <div className="flex h-full">
      <Sidebar />

      <div className="flex-1 p-8 ml-64">
        <h1 className="text-3xl font-semibold text-center mb-7">Hotel Profile</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg mx-auto">
          <input
            type="file"
            ref={fileRef}
            hidden
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />
          <img
            src={formData.profilePicture || currentUser.profilePicture}
            alt="hotel profile"
            className="h-24 w-24 self-center cursor-pointer rounded-full object-cover"
            onClick={() => fileRef.current.click()}
          />
          
          <p className="text-sm self-center">
            {imageError ? (
              <span className="text-red-700">
                Error uploading image (file size must be less than 2 MB)
              </span>
            ) : imagePercent > 0 && imagePercent < 100 ? (
              <span className="text-slate-700">{`Uploading: ${imagePercent} %`}</span>
            ) : imagePercent === 100 ? (
              <span className="text-green-700">Image uploaded successfully</span>
            ) : (
              ''
            )}
          </p>

          <input
            defaultValue={currentUser.username}
            type="text"
            id="username"
            placeholder="Hotel Name"
            className="bg-slate-100 rounded-lg p-3"
            disabled
          />
          {errors.hotelName && <p className="text-red-500">{errors.hotelName}</p>}

          <input
            defaultValue={currentUser.email}
            type="email"
            id="email"
            placeholder="Email"
            className="bg-slate-100 rounded-lg p-3"
            disabled
          />
          {errors.email && <p className="text-red-500">{errors.email}</p>}
          {errors.password && <p className="text-red-500">{errors.password}</p>}
          
        </form>
        <div className="flex justify-center mt-7">
  <button
    onClick={handleSignOut}
    className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80 w-full max-w-lg"
  >
    Sign out
  </button>
</div>


          
      </div>
    </div>
  );
}
