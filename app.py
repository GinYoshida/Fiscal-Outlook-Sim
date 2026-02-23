import streamlit as st
import subprocess
import os

st.set_page_config(
    page_title="統合政府 30年財政シミュレーター",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown("""
<style>
    .stMainBlockContainer { padding: 0 !important; }
    .block-container { padding: 0 !important; max-width: 100% !important; }
    header[data-testid="stHeader"] { display: none !important; }
    .stAppDeployButton { display: none !important; }
    [data-testid="stSidebar"] { display: none !important; }
    .stMainMenu { display: none !important; }
    footer { display: none !important; }
    iframe { border: none !important; }
</style>
""", unsafe_allow_html=True)

dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')
index_path = os.path.join(dist_dir, 'index.html')

if not os.path.exists(index_path):
    st.info("ビルド中...")
    result = subprocess.run(
        ['npx', 'vite', 'build'],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        capture_output=True, text=True
    )
    if result.returncode != 0:
        st.error(f"ビルドエラー: {result.stderr}")
        st.stop()
    st.rerun()

with open(index_path, 'r') as f:
    html = f.read()

assets_dir = os.path.join(dist_dir, 'assets')
if os.path.exists(assets_dir):
    import base64
    for fname in sorted(os.listdir(assets_dir)):
        fpath = os.path.join(assets_dir, fname)
        with open(fpath, 'r') as f:
            content = f.read()
        if fname.endswith('.css'):
            html = html.replace(
                f'<link rel="stylesheet" crossorigin href="/assets/{fname}">',
                f'<style>{content}</style>'
            )
        elif fname.endswith('.js'):
            html = html.replace(
                f'<script type="module" crossorigin src="/assets/{fname}"></script>',
                f'<script type="module">{content}</script>'
            )

st.markdown("""
<style>
    .stApp header { display: none !important; }
    .stMainBlockContainer { padding: 0 !important; max-width: 100% !important; }
    .block-container { padding: 0 !important; max-width: 100% !important; }
    iframe { min-height: 100vh !important; }
</style>
""", unsafe_allow_html=True)

st.components.v1.html(html, height=2000, scrolling=True)
