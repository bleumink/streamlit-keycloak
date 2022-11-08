import { onMount, afterUpdate } from "svelte";
import { Streamlit } from "./streamlit";

/**
 * [Optional] Set Streamlit Svelte Lifecycle functions
 *
 * You are not required call this function on your Streamlit
 * component. If you decide not to call it, you should implement the
 * `onMount` and `afterUpdate` functions in your own component,
 * so that your plugin properly resizes.
 */
export const setStreamlitLifecycle = (): void => {
  onMount((): void => {
    // Finally, tell Streamlit to update our initial height. We omit the
    // `height` parameter here to have it default to our scrollHeight.
    Streamlit.setFrameHeight();
  });

  afterUpdate((): void => {
    // We tell Streamlit to update our frameHeight after each update, in
    // case it has changed. (This isn't strictly necessary for the example
    // because our height stays fixed, but this is a low-cost function, so
    // there's no harm in doing it redundantly.)
    Streamlit.setFrameHeight();
  });
};
