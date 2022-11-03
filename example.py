from streamlit_keycloak_component import keycloak
import streamlit as st

st.title("Keycloak example")
user_info = keycloak(
    url="http://localhost:8080",
    realm="myrealm",
    client_id="myclient",
    init_options={
        "checkLoginIframe": False
    }
)

if user_info.authenticated:
    st.write(user_info)

else:
    st.write("Not authenticated yet")
