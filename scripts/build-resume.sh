#!/bin/sh
set -e
cd "$(dirname "$0")/../resume"
for language in en pt; do
  xelatex -interaction=nonstopmode -halt-on-error "resume-$language.tex" >/dev/null
done
cp resume-en.pdf ../public/gabriel-rosa-resume-en.pdf
cp resume-pt.pdf ../public/gabriel-rosa-curriculo-pt.pdf
echo "Resumes built into public/"
