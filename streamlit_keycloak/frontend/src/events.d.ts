declare namespace svelte.JSX {
    interface HTMLProps<T> {
        onloggedin?: (event: CustomEvent) => void
    }
}
