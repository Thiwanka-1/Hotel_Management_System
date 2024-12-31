import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentHotel: null,
  loading: false,
  error: false,
};

const hotelSlice = createSlice({
  name: 'hotel',
  initialState,
  reducers: {
    getHotelStart: (state) => {
      state.loading = true;
    },
    getHotelSuccess: (state, action) => {
      state.currentHotel = action.payload;
      state.loading = false;
      state.error = false;
    },
    getHotelFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateHotelStart: (state) => {
      state.loading = true;
    },
    updateHotelSuccess: (state, action) => {
      state.currentHotel = { ...state.currentHotel, ...action.payload };
      state.loading = false;
      state.error = false;
    },
    updateHotelFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteHotelStart: (state) => {
      state.loading = true;
    },
    deleteHotelSuccess: (state) => {
      state.currentHotel = null;
      state.loading = false;
      state.error = false;
    },
    deleteHotelFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  getHotelStart,
  getHotelSuccess,
  getHotelFailure,
  updateHotelStart,
  updateHotelSuccess,
  updateHotelFailure,
  deleteHotelStart,
  deleteHotelSuccess,
  deleteHotelFailure,
} = hotelSlice.actions;

export default hotelSlice.reducer;
