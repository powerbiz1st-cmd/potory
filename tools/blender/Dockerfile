# 3D 모델 변환용 Blender (헤드리스). PC에 설치하지 않고 이 컨테이너 안에서만 사용합니다.
# 사용: docker compose -f tools/blender/compose.yml run --rm blender -b <파일.blend> --disable-autoexec --python /scripts/<스크립트>.py -- <인자>
# (--disable-autoexec: .blend 안에 들어 있을 수 있는 스크립트는 실행하지 않음)
FROM debian:bookworm-slim

ARG BLENDER_VERSION=4.2.23
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl xz-utils \
      libx11-6 libxi6 libxrender1 libxxf86vm1 libxfixes3 libxkbcommon0 libsm6 libice6 libgl1 libegl1 libglu1-mesa \
    && curl -fsSL "https://download.blender.org/release/Blender4.2/blender-${BLENDER_VERSION}-linux-x64.tar.xz" -o /tmp/blender.tar.xz \
    && mkdir /opt/blender && tar -xJf /tmp/blender.tar.xz -C /opt/blender --strip-components=1 \
    && rm /tmp/blender.tar.xz && apt-get purge -y curl xz-utils && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["/opt/blender/blender"]
