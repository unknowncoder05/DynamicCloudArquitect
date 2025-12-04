import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import terraformReducer from './terraformSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    terraform: terraformReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
