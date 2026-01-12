-- Create the trigger that was missing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert missing profile for lucy2511kh@gmail.com
INSERT INTO public.profiles (id, email, display_name)
VALUES ('335ed777-07dc-418e-9e18-a60fefaaac1f', 'lucy2511kh@gmail.com', 'lucy2511kh')
ON CONFLICT (id) DO NOTHING;

-- Insert missing wallet
INSERT INTO public.user_wallets (user_id, balance)
VALUES ('335ed777-07dc-418e-9e18-a60fefaaac1f', 0)
ON CONFLICT (user_id) DO NOTHING;

-- Insert missing role
INSERT INTO public.user_roles (user_id, role)
VALUES ('335ed777-07dc-418e-9e18-a60fefaaac1f', 'user')
ON CONFLICT (user_id, role) DO NOTHING;