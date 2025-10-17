'use client';

import { useState } from 'react';
import { signInWithGoogle } from './action';

const AuthForm = ({toggleClick} : {toggleClick : () => void}) => {
  return (
    <>
    <div className='bg-black opacity-25 h-screen w-full absolute left-0 top-0'></div>
    <div className="fixed inset-0  flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <button onClick={toggleClick} className="p-2 hover:bg-gray-100 rounded-full transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-base font-semibold absolute left-1/2 transform -translate-x-1/2">
            Log in or sign up
          </h2>
          <div className="w-8"></div>
        </div>

        {/* Body */}
        <div className="p-6">
          <h3 className="text-2xl font-semibold mb-6">Welcome to Airbnb</h3>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg transition"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </button>

            <button className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continue with Apple
            </button>

            <button className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 8v8m-4-4h8" />
              </svg>
              Continue with email
            </button>

            <button className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continue with Facebook
            </button>
          </div>
        </div>
      </div>
    </div> 
    </>
  );
};

export default AuthForm;