@echo off
echo =========================================================================
echo Digital Disinformation & AI Risk Dashboard (2020-2022)
echo =========================================================================
echo.
echo Starting local web server at http://localhost:8000 ...
echo Press Ctrl+C in this terminal to stop the server.
echo.
start http://localhost:8000
python -m http.server 8000
