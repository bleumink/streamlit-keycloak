import os
import streamlit.components.v1 as components
from dataclasses import dataclass
from typing import Optional


@dataclass
class Keycloak:
    authenticated: bool
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    user_info: Optional[dict] = None


# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
# (This is, of course, optional - there are innumerable ways to manage your
# release process.)
_RELEASE = True

# Declare a Streamlit component. `declare_component` returns a function
# that is used to create instances of the component. We're naming this
# function "_component_func", with an underscore prefix, because we don't want
# to expose it directly to users. Instead, we will create a custom wrapper
# function, below, that will serve as our component's public API.

# It's worth noting that this call to `declare_component` is the
# *only thing* you need to do to create the binding between Streamlit and
# your component frontend. Everything else we do in this file is simply a
# best practice.

if not _RELEASE:
    _keycloak_component = components.declare_component(
        # We give the component a simple, descriptive name ("my_component"
        # does not fit this bill, so please choose something better for your
        # own component :)
        "keycloak",
        # Pass `url` here to tell Streamlit that the component will be served
        # by the local dev server that you run via `npm run start`.
        # (This is useful while your component is in development.)
        url="http://localhost:3001",
    )
else:
    # When we're distributing a production version of the component, we'll
    # replace the `url` param with `path`, and point it to to the component's
    # build directory:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _keycloak_component = components.declare_component("keycloak", path=build_dir)


# Create a wrapper function for the component. This is an optional
# best practice - we could simply expose the component function returned by
# `declare_component` and call it done. The wrapper allows us to customize
# our component's API: we can pre-process its input args, post-process its
# output value, and add a docstring for users.
def login(
    url: str,
    realm: str,
    client_id: str,
    auto_refresh: bool = True,
    init_options: Optional[dict] = None,
    key: Optional[str] = None,
) -> Keycloak:
    """Creates a new Keycloak component and authenticates.

    Parameters
    ----------
    url: str
        URL of the Keycloak server.
    realm: str
        Realm to authenticate with.
    client_id: str
        Client ID to authenticate with.
    auto_refresh: bool
        Automatically refresh the access token when it expires.
        This rerenders the app. Defaults to true.
    init_options: dict or None
        Optionally set initialization options for Keycloak. These are passed on to
        the init function in the frontend. See keycloak-js documentation for details.
    key: str or None
        An optional key that uniquely identifies this component. If this is
        None, and the component's arguments are changed, the component will
        be re-mounted in the Streamlit frontend and lose its current state.

    Returns
    -------
    Keycloak
        A dataclass containing authentication state, access token, refresh token and user information.

    """
    # Call through to our private component function. Arguments we pass here
    # will be sent to the frontend, where they'll be available in an "args"
    # dictionary.
    #
    # "default" is a special argument that specifies the initial return
    # value of the component before the user has interacted with it.

    default = {"authenticated": False}
    keycloak = _keycloak_component(
        url=url,
        realm=realm,
        clientId=client_id,
        autoRefresh=auto_refresh,
        initOptions=init_options,
        key=key,
        default=default,
    )

    return Keycloak(**keycloak)


# Add some test code to play with the component while it's in development.
# During development, we can run this just as we would any other Streamlit
# app: `$ streamlit run keycloak/__init__.py`
if not _RELEASE:
    import streamlit as st

    st.subheader("Authenticate with Keycloak")

    keycloak = login(
        "http://localhost:8080",
        "myrealm",
        "myclient",
        init_options={"checkLoginIframe": False},
    )

    st.write(keycloak)
