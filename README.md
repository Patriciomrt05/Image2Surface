PROJECT STRUCTURE

Image2Surface/
  backend/
    main.py
    processing.py
    depth_anything_v2/
    checkpoints/   # (not included in repo)
  assets/
    images/
      tree_test_img.jpg
  outputs/
    mesh.obj       # generated output
  requirements.txt
  README.md



SETUP
  
git clone https://github.com/Patriciomrt05/Image2Surface.git
cd Image2Surface

pip install -r requirements.txt

mkdir -p backend/checkpoints
cd backend/checkpoints

curl -L -o depth_anything_v2_vits.pth \
https://huggingface.co/LiheYoung/depth_anything_v2/resolve/main/depth_anything_v2_vits.pth



RUN PIPELINE
cd backend
python3 main.py

Output --> outputs/mesh.obj
