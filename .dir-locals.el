((nil .
      ((eval .
             (add-to-list 'exec-path
                          (concat (locate-dominating-file default-directory dir-locals-file)
                                  "node_modules/.bin/")))))
 (sql-mode . ((eval . (sql-set-product 'postgres)))))
