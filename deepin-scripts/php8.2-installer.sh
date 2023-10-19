#!/bin/bash
# script by khumnath
function askYesNo {
        QUESTION=$1
        DEFAULT=$2
        if [ "$DEFAULT" = true ]; then
                OPTIONS="[Y/n]"
                DEFAULT="y"
            else
                OPTIONS="[y/N]"
                DEFAULT="n"
        fi
        read -p "$QUESTION $OPTIONS " -n 1 -s -r INPUT
        INPUT=${INPUT:-${DEFAULT}}
        echo ${INPUT}
        if [[ "$INPUT" =~ ^[yY]$ ]]; then
            ANSWER=true
        else
            ANSWER=false
        fi
}
echo "this script installs apache2 php8.2 and some php extensions"
askYesNo "Do you like to continue?" true
DOIT=$ANSWER

if [ "$DOIT" = true ]; then
sudo apt install wget
sudo curl -sSLo /usr/share/keyrings/php.gpg https://packages.sury.org/php/apt.gpg
sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/php.gpg] https://packages.sury.org/php/ bullseye main" > /etc/apt/sources.list.d/php.list'
sudo apt update
cd ~/Downloads
wget http://ftp.us.debian.org/debian/pool/main/libg/libgav1/libgav1-0_0.16.0-5_amd64.deb
wget http://ftp.us.debian.org/debian/pool/main/d/dav1d/libdav1d4_0.7.1-3_amd64.deb
wget http://ftp.us.debian.org/debian/pool/main/liba/libavif/libavif9_0.8.4-2+deb11u1_amd64.deb
sudo dpkg -i *.deb
cd ~
sudo apt install php8.2 php8.2-fpm
sudo apt install php8.2-mysql php8.2-mbstring php8.2-xml php8.2-gd php8.2-curl
sudo apt install apache2
sudo apt-get install libapache2-mod-php8.2
sudo chmod 777 /var/www/html
sh -c 'echo "<?php phpinfo(); ?>" > /var/www/html/phptest.php'

sudo systemctl start apache2
sudo /etc/init.d/apache2 restart
echo "all set! you can check localhost/phptest.php on browser"
fi