<script lang="ts">
  import { onMount, afterUpdate, onDestroy } from "svelte";
  import { Streamlit } from "./streamlit";
  import type { RenderData } from "./streamlit";

  /**
   * Custom Streamlit component
   */
  export let component: any;

  /**
   * Set to false if you want `args` (the named dictionary of arguments passed
   * from Python) to be passed as a dictionary to your component.
   *
   * Default is `true`.
   */
  export let spreadArgs: boolean = true;

  // State
  let renderData: RenderData;

  //  Props passed to custom Streamlit components.
  /** Named dictionary of arguments passed from Python.
   *  Arguments will be passed directly if `spreadArgs=true`
   */
  let args: any;

  /** The component's width. */
  let width: number;

  /**
   * True if the component should be disabled.
   * All components get disabled while the app is being re-run,
   * and become re-enabled when the re-run has finished.
   */
  let disabled: boolean;

  /**
   * Streamlit is telling this component to redraw.
   * We save the render data in State, so that it can be passed to the
   * component.
   */
  const onRenderEvent = (event: Event): void => {
    // Update our state with the newest render data
    renderData = (event as CustomEvent<RenderData>).detail;
    args = renderData.args;
    disabled = renderData.disabled;
  };

  onMount((): void => {
    // Set up event listeners, and signal to Streamlit that we're ready.
    // We won't render the component until we receive the first RENDER_EVENT.
    Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRenderEvent);
    Streamlit.setComponentReady();
  });

  onDestroy((): void => {
    // Remove our `onRender` handler to Streamlit's render event.
    Streamlit.events.removeEventListener(Streamlit.RENDER_EVENT, onRenderEvent);
  });
</script>

<svelte:window bind:innerWidth={width} />
<!-- Don't render until we've gotten our first RENDER_EVENT from Streamlit. -->
{#if renderData}
  {#if spreadArgs}
    <svelte:component this={component} {...args} {disabled} {width} />
  {:else}
    <svelte:component this={component} {args} {disabled} {width} />
  {/if}
{/if}
