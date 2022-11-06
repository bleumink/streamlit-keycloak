# Streamlit Keycloak
**Keycloak authentication inside your Streamlit app**

## Installation
`pip install streamlit-keycloak`

## Usage
Creating a Keycloak component will perform authentication when the app is rendered.
Credentials can be provided in the popup window. Outside of a SSO environment, you must allow popups to be able to log in.

The component returns a tuple containing the authentication state, OAuth2 token and user info respectively. If a refresh token is present, tokens are refreshed automatically. This will rerender the app.

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