'''
    # Detecção de Bordas / Realce
    'bordas-sobel': ...,#_apply_sobel,
    'bordas-laplace': ...,#_apply_laplace,
    'bordas-canny': ...,#_apply_canny,
    'agucamento':... #_apply_sharpening,
'''

import cv2
import numpy as np

def bordas_sobel(img, p1, p2, p3):
    # Recebe os valores de p1 (modificando para impar)
    sobel_kernel = int(p1) if int(p1) % 2 == 1 else int(p1) + 1
    aplicar_img_original = str(p2).strip().lower() == 'true'

    gray_img = img if len(img.shape) == 2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Aplica o sobel das duas dimensões
    sobelX = cv2.Sobel(gray_img, cv2.CV_64F, 1, 0, ksize=sobel_kernel)
    sobelY = cv2.Sobel(gray_img, cv2.CV_64F, 0, 1, ksize=sobel_kernel)

    magnitude = cv2.magnitude(sobelX, sobelY)
    result = np.uint8(np.clip(magnitude, 0, 255))

    if aplicar_img_original:
        result_bgr = cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)
        return _merge_original_edge(img, result_bgr)

    return result

def bordas_laplace(img, p1, p2, p3):
    kernel = int(p1) if int(p1) % 2 == 1 else int(p1) + 1
    aplicar_img_original = str(p2).strip().lower() == 'true'

    # Aplica a imagem para HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, target = cv2.split(hsv)

    # Aplicamos o laplace no canal V
    target_float = target.astype(np.float64)
    laplace = cv2.Laplacian(target_float, cv2.CV_64F, ksize=kernel)

    # Caso não escolhido aplicar a imagem original
    if not aplicar_img_original:
        return np.uint8(np.clip(np.abs(laplace), 0, 255))

    target_agucada = np.uint8(np.clip(target_float - 0.3 * laplace, 0, 255))

    # Aguça a imagem original
    result = cv2.merge([h, s, target_agucada])
    result = cv2.cvtColor(result, cv2.COLOR_HSV2BGR)

    return result


def bordas_canny(img, p1, p2, p3):
    thresh1 = int(p1)
    thresh2 = int(p2) 
    aplicar_img_original = str(p3).strip().lower() == 'true'

    # Pegando apenas o canals de intensidade
    img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    _, _, target = cv2.split(img_hsv)

    # Aplicando as bordas canny
    bordas = cv2.Canny(target, thresh1, thresh2)

    # Caso o usuario quiser aplicar as bordas na imagem original
    if aplicar_img_original:
        bordas = cv2.cvtColor(bordas, cv2.COLOR_GRAY2BGR)
        return _merge_original_edge(img, bordas)

    return bordas

def agucamento(img, p1, p2, p3):
    kernel_size = int(p1) if int(p1) % 2 == 1 else int(p1) + 1
    forca_bordas = float(p2)
    aplicar_img_original = str(p3).strip().lower() == 'true'

    # Aplica o filtro de borramento e subtrai com a imagem original
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    borramento = cv2.GaussianBlur(img_gray, (kernel_size, kernel_size), 0)
    mask = cv2.subtract(img_gray, borramento)

    if aplicar_img_original:
        mask = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
        return _merge_original_edge(img, mask, forca_bordas)

    return mask

def _merge_original_edge(img, edge, beta=0.3):
    result = cv2.addWeighted(img, 1.0, edge, beta, 0)
    return result
