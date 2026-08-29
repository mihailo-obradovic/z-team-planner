export function useAccountDialogs() {
  const deleteAccountOpen = useState('account-dialog-delete', () => false);

  return { deleteAccountOpen };
}
