from streamlit_keycloak import login
import streamlit as st

st.title("Keycloak example")
keycloak = login(
    url="http://localhost:8080",
    realm="myrealm",
    client_id="myclient",
    auto_refresh=True,
    init_options={"checkLoginIframe": False},
    custom_labels={"errorPopupClosed": "You closed the popup!"}
)

if keycloak.authenticated:
    st.write(keycloak)
