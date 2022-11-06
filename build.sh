#!/bin/bash
cd streamlit_keycloak/frontend  \
    && npm run build            \
    && cd ../..                 \
    && rm -rf dist/*            \
    && python setup.py sdist bdist_wheel