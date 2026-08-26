/**
 * Open state for the account dialogs.
 *
 * Same reason as `useBuildDialogs`: the controls that open these render once per header tier,
 * while the dialog itself must be mounted exactly once or every open raises a stack of them.
 */
export function useAccountDialogs() {
  // * Deliberately not `accountDeleteOpen`, which `useBuildDialogs` already uses for deleting
  // * one build from the account. This one deletes the account.
  const deleteAccountOpen = useState('account-dialog-delete', () => false);

  return { deleteAccountOpen };
}
