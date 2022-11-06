# Streamlit Keycloak
**Keycloak user authentication and single sign-on inside your Streamlit app**

## Installation
`pip install streamlit-keycloak`

## Usage
Simply create the Keycloak component and it will perform the authentication when the app is rendered. First it will attempt to silently authenticate using single sign-on. If this fails, the component will open a popup where you can provide your credentials. (Note: so you must allow popups for this to work)

When authentication is successful, the component returns a tuple containing the authentication state, an access token, which can be used to access other restricted resources, and a user info object, containing e.g. the username and groups. If your configuration provides refresh tokens, the access token will automatically be refreshed when it expires, which will also rerender your app.

## Example
```python
from streamlit_keycloak import keycloak
import streamlit as st


def main():
    st.subheader(f"Welcome {user_info['preferred_username']}!")
    st.write(f"Here is your OAuth2 token: {token}")


authenticated, token, user_info = keycloak(
    url="http://localhost:8080",
    realm="myrealm",
    client_id="myclient",
)

st.title("Streamlit Keycloak example")

if authenticated:
    main()

else:
    st.write("Authenticating...")
```
![streamlit-keycloak showcase|639x663](https://github.com/bleumink/streamlit-keycloak/blob/master/example.gif?raw=true)

## Todo
- Logout functionality?
