# Streamlit Keycloak
**Keycloak user authentication and single sign-on inside your Streamlit app**

## Installation
`pip install streamlit-keycloak`

## Usage
Provide the URL to your Keycloak server, the realm and client and the component will perform the authentication when the app is rendered. First it will attempt to silently authenticate using single sign-on. If this fails, the component will open a popup to the Keycloak login page (note: so you must allow popups for this to work).

When authentication is successful, the component returns a dataclass containing the authentication state, an access token, which can be used to access other restricted resources, a refresh token and a user info object, containing e.g. the username and group memberships. If your configuration provides refresh tokens, the access token can be automatically refreshed when it expires.

So far the component has not been tested in a wide variety of environments. So if you’re also using Keycloak and would benefit from less logging in and easy access to tokens, give this a go and share your experience. Feedback is always welcome.

Frontend authentication like this can only be done with clients that have their access type set to ‘public’ as their is no way to securely provide the client secret from the browser.

## Example
```python
from streamlit_keycloak import login
import streamlit as st


def main():
    st.subheader(f"Welcome {keycloak.user_info['preferred_username']}!")
    st.write(f"Here is your OAuth2 token: {keycloak.access_token}")


keycloak = login(
    url="http://localhost:8080",
    realm="myrealm",
    client_id="myclient",
)

st.title("Streamlit Keycloak example")

if keycloak.authenticated:
    main()
```
![streamlit-keycloak showcase|639x663](https://github.com/bleumink/streamlit-keycloak/blob/master/example.gif?raw=true)

## Credits
Many thanks to the authors of the [streamlit-auth0](https://github.com/conradbez/streamlit-auth0) and [auth0-spa-js](https://github.com/auth0/auth0-spa-js) packages for inspiring a large part of the approach.

And thanks to 93degree for the [Svelte component template](https://github.com/93degree/streamlit-component-svelte-template), which is awesome.