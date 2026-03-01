#!/bin/bash
export DEBIAN_FRONTEND=noninteractive

echo "Actualizando repositorios..."
apt-get update

echo "Instalando certificados..."
apt-get install -y ca-certificates curl

echo "Creando llaves y repositorios externos..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "Inyectando repositorio oficial de Docker..."
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

echo "Actualizando nueva lista e instalando Docker Nativo..."
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "Configurando permisos..."
DEFAULT_USER=$(ls -1 /home | head -n 1)
if [ ! -z "$DEFAULT_USER" ]; then
    usermod -aG docker $DEFAULT_USER
    echo "Permisos otorgados a $DEFAULT_USER"
fi

echo "Iniciando Motor Docker (Daemon)..."
service docker start

echo "Instalacion Finalizada en el Nucleo Linux."
