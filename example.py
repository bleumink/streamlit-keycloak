from streamlit_keycloak import login
import streamlit as st

st.title("Keycloak example")
keycloak = login(
    url="http://localhost:8080",
    realm="myrealm",
    client_id="myclient",
    init_options={"checkLoginIframe": False},
)

if keycloak.authenticated:
    st.write(keycloak)
