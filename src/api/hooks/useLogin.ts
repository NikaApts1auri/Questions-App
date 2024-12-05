import { useMutation } from 'react-query';
import axios from 'axios';
import { useAtom } from 'jotai';
import { errorAtom } from '../../store/store';
import { loginUser as apiLoginUser } from '../requests/login';
import { refreshToken as apiRefreshToken } from '../requests/refreshToken';
import { isAuthenticatedAtom } from '../../store/authAtoms';

interface FormData {
  identifier: string;
  password: string;
}

interface LoginResponse {
  tokens: {
    access: string;
    refresh: string;
  };
}

interface RefreshTokenResponse {
  access: string;
}

export const useLogin = () => {
  const [, setError] = useAtom(errorAtom);
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);

  const loginMutation = useMutation<LoginResponse, unknown, FormData>(apiLoginUser, {
    onSuccess: (data: LoginResponse) => {
      setError(null);
      localStorage.setItem('accessToken', data.tokens.access);
      localStorage.setItem('refreshToken', data.tokens.refresh);
      setIsAuthenticated(true);
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setError('Identifier or password is incorrect');
      } else {
        setError('Error logging in user');
      }
      console.error('Error logging in user:', error);
    },
  });

  const refreshMutation = useMutation<RefreshTokenResponse, unknown, string>(apiRefreshToken, {
    onSuccess: (data: RefreshTokenResponse) => {
      setError(null);
      localStorage.setItem('accessToken', data.access);
    },
    onError: (error: unknown) => {
      setError('Error refreshing token');
      console.error('Error refreshing token:', error);
    },
  });

  const loginUser = async (data: FormData, onSuccess: () => void) => {
    loginMutation.mutate(data, {
      onSuccess,
    });
  };

  const refreshUserToken = async (refreshToken: string) => {
    refreshMutation.mutate(refreshToken);
  };

  return { loginUser, refreshUserToken, isLoading: loginMutation.isLoading || refreshMutation.isLoading };
};